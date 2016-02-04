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

    /**
      *  Populate the cache.
      */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };

    // Web app logic
    self.routes = {};
    self.routes['health'] = function(req, res){ res.send('1'); };
  
    //default response with info about app URLs
    self.routes['root'] = function(req, res){ 
        res.setHeader('Content-Type', 'text/html');
        res.send(self.cache_get('index.html') );
    };

    // Retourne la liste des médicaments
    self.routes['returnAllMedocs'] = function(req, res){
        self.db.collection('medicaments').find().toArray(function(err, medocs) {
            res.header("Content-Type:","application/json");
            res.end(JSON.stringify(medocs));
        });
    };

    // Retourne le medoc dont l'id est passé dans l'URL
    self.routes['returnAMedoc'] = function(req, res){
        var BSON = mongodb.BSONPure;
        var parkObjectID = new BSON.ObjectID(req.params.id);
        self.db.collection('parkpoints').find({'_id':parkObjectID}).toArray(function(err, names){
            res.header("Content-Type:","application/json"); 
            res.end(JSON.stringify(names));
        });
    }

    // Enregistre un médicament
    self.routes['postAMedoc'] = function(req, res){
        var seb = req.body.seb;
        //self.db.collection('medicaments').insert( { "authorization_holder" : authorization_holder }, {w:1}, function(err, records){
        //if (err) { throw err; }
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
    // override with POST having ?_method=DELETE
    self.app.use(methodOverride('_method'))

    //define all the url mappings
    self.app.get('/health', self.routes['health']);
    self.app.get('/', self.routes['root']);
    self.app.get('/ws/medocs', self.routes['returnAllMedocs']);
    self.app.get('/ws/medocs/medoc/:id', self.routes['returnAMedoc']);
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
app.populateCache();

//call the connectDb function and pass in the start server command
app.connectDb(app.startServer);