#!/bin/env node

var express = require('express');
var fs      = require('fs');
var mongodb = require('mongodb');

var App = function(){

    // Scope
    var self = this;

    // Setup
    self.dbServer = new mongodb.Server(process.env.OPENSHIFT_MONGODB_DB_HOST,parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT));
    self.db = new mongodb.Db(process.env.OPENSHIFT_APP_NAME, self.dbServer, {auto_reconnect: true});
    self.dbUser = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
    self.dbPass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;

    self.ipaddr  = process.env.OPENSHIFT_NODEJS_IP;
    self.port    = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;
    if (typeof self.ipaddr === "undefined") {
        console.warn('No OPENSHIFT_NODEJS_IP environment variable');
    };

    // Web app logic
    self.routes = {};
    self.routes['health'] = function(req, res){ 
        res.send('Server alive'); 
    };
  
    // Retourne la liste des médicaments
    self.routes['returnAllMedocs'] = function(req, res){

        // On ne veut pas plus de 100 documents remontés...
        self.db.collection('medicaments').find().limit( 100 ).toArray(function(err, medocs) {
            res.header("Content-Type:","application/json; charset=utf-8");
            res.end(JSON.stringify(medocs));
        });
    };

    // Retourne le medoc dont l'id est passé dans l'URL
    self.routes['medocById'] = function(req, res){
        //var BSON = mongodb.BSONPure;
        //var medocObjectID = new BSON.ObjectID(req.params.id);
        var idMedoc = parseInt(req.params.id);
        self.db.collection('medicaments').find({'id':idMedoc}).toArray(function(err, medoc){
            res.header("Content-Type:","application/json; charset=utf-8");
            // Retourne le JSON (on force le mode 'pretty')
            //res.end(JSON.stringify(medoc, null, 3));
            res.end(JSON.stringify(medoc));
        });
    }

    // Retourne les medocs dont le nom est contenu dans le paramètre passé dans l'URL
    self.routes['medocsByNom'] = function(req, res){
        var medoc = req.params.nom;
        var pattern = new RegExp('.*' + medoc + '.*','i');
        self.db.collection('medicaments').find({'title': pattern}).toArray(function(err, medocs){
            res.header("Content-Type:","application/json; charset=utf-8");
            // Retourne le JSON (on force le mode 'pretty')
            // res.end(JSON.stringify(medocs, null, 3));
            res.end(JSON.stringify(medocs));
        });
    }

    // Retourne les medocs dont le fabriquant est passé dans l'URL
    self.routes['medocsByFabriquant'] = function(req, res){
        var fabriquant = req.params.nom;
        var pattern = new RegExp('.*' + fabriquant + '.*','i');
        self.db.collection('medicaments').find({'authorization_holder': pattern}).toArray(function(err, medocs){
            res.header("Content-Type:","application/json; charset=utf-8");
            // Retourne le JSON (on force le mode 'pretty')
            //res.end(JSON.stringify(medocs, null, 3));
            res.end(JSON.stringify(medocs));
        });
    }

    // Retourne les medocs dont le fabriquant est exactement celui passé dans l'URL
    self.routes['medocsByFabriquantExact'] = function(req, res){
        self.db.collection('medicaments').find({'authorization_holder': req.params.nom}).toArray(function(err, medocs){
            res.header("Content-Type:","application/json; charset=utf-8");
            // Retourne le JSON (on force le mode 'pretty')
            //res.end(JSON.stringify(medocs, null, 3));
            res.end(JSON.stringify(medocs));
        });
    }
    
     // Retourne le nombre de medocs par fabriquant
    self.routes['nbMedocsByFabriquant'] = function(req, res){
        self.db.collection('medicaments').aggregate([{$group : {_id:'$authorization_holder', count:{$sum:1}}}]).toArray(function(err, medocs){
            res.header("Content-Type:","application/json; charset=utf-8");
            res.end(JSON.stringify(medocs));
        });
    }

    // Enregistre un médicament
    self.routes['postAMedoc'] = function(req, res){
        //var medicament = req.body.medicament;
        //self.db.collection('medicaments').insert( medicament, {w:1}, function(err, records){
        //if (err) { 
        //    throw err; 
        //}
        //res.end('success');
        //});
    };


    // Web app urls
    self.app  = express();

    //This uses the Connect frameworks body parser to parse the body of the post request
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    // parse application/x-www-form-urlencoded
    self.app.use(bodyParser.urlencoded());
    // parse application/json
    self.app.use(bodyParser.json());

    // On compresse les échanges
    self.app.use(express.compress());

    // override with POST having ?_method=DELETE
    self.app.use(methodOverride('_method'))

    self.app.use(express.static('public'));
    //define all the url mappings
    self.app.get('/health', self.routes['health']);
   // self.app.get('/', self.routes['root']);
    self.app.get('/ws/medocs', self.routes['returnAllMedocs']);
    self.app.get('/ws/medoc/:id', self.routes['medocById']);
    self.app.get('/ws/medocs/fabriquants', self.routes['nbMedocsByFabriquant']);
    self.app.get('/ws/medocs/medicament/:nom', self.routes['medocsByNom']);
    self.app.get('/ws/medocs/fabriquant/:nom', self.routes['medocsByFabriquant']);
    self.app.get('/ws/medocs/fabriquantexact/:nom', self.routes['medocsByFabriquantExact']);
    self.app.post('/ws/medocs/medicament', self.routes['postAMedoc']);

    // Logic to open a database connection. We are going to call this outside of app so it is available to all our functions inside.
    self.connectDb = function(callback){
        self.db.open(function(err, db){
        if(err){ throw err };
        self.db.authenticate(self.dbUser, self.dbPass, {authdb: "admin"}, function(err, res){
            if(err){ throw err };
            callback();
        });
        });
    };
  
  
    //starting the nodejs server with express
    self.startServer = function(){
        self.app.listen(self.port, self.ipaddr, function(){
            console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddr, self.port);
        });
    }

    // Destructors
    self.terminator = function(sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating Node server ...', Date(Date.now()), sig);
            process.exit(1);
        };
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    process.on('exit', function() { self.terminator(); });

    self.terminatorSetup = function(element, index, array) {
        process.on(element, function() { self.terminator(element); });
    };


    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'].forEach(self.terminatorSetup);

};

//make a new express app
var app = new App();

//call the connectDb function and pass in the start server command
app.connectDb(app.startServer);