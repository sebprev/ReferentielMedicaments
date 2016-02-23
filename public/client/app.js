 /*
  * Barre de navigation.
  */
var NavBar = React.createClass({
  ouvrirAide: function(event) {
    $('#info').openModal();
  },
  ouvrirRecherche: function(event) {
    $('#recherche').openModal();
  },
  retourAccueil: function(event) {
    this.props.retourAccueil();
  },
  render: function() {
    return (
      <div className="navbar-fixed">
      <nav>
        <div className="nav-wrapper">
          <a className="brand-logo center hide-on-med-and-down">Base de données médicaments</a>
          <ul className="right">
            <li><a onClick={this.ouvrirRecherche} className="tooltipped" data-position="bottom" data-delay="50" data-tooltip="Rechercher un médicament"><i className="material-icons">search</i></a></li>
            <li><a onClick={this.retourAccueil} className="tooltipped" data-position="bottom" data-delay="50" data-tooltip="Page accueil"><i className="material-icons">view_list</i></a></li>
            <li><a onClick={this.ouvrirAide} className="tooltipped" data-position="bottom" data-delay="50" data-tooltip="Aide"><i className="material-icons">info</i></a></li>
            <li><a className="tooltipped" data-position="bottom" data-delay="50" data-tooltip="Actions"><i className="material-icons">more_vert</i></a></li>
          </ul>
        </div>
      </nav>
    </div>
    )
  }
});

var InfoModal = React.createClass({
  closeModal: function(event) {
    $('#info').closeModal();
  },
  render: function() {
    var p1 = "Ce site est un site personnel basé sur les données fournies par le site ";
    var p2 = ". Ces données ont été récupérées en février 2016 et ne sont pas mises à jour sur ce même site. Il se peut donc que certaines informations ne soient plus d'actualité.";
    var p3 = "Pour toute remarque ou suggestion, n'hésitez pas à nous contacter (voir comment en bas de page).";
    return (
      <div id="info" className="modal">
        <div className="modal-content">
          <h4>Informations sur ce site</h4>
          <p>{p1}<a href="https://www.data.gouv.fr/fr/datasets/base-de-donnees-publique-des-medicaments-base-officielle/">data.gouv.fr</a>{p2}</p>
          <p>{p3}</p>
        </div>
        <div className="modal-footer">
          <a onClick={this.closeModal} className="modal-action modal-close waves-effect waves-green btn-flat">Fermer</a>
        </div>
      </div>
    )
  }
});

 /*
  * Le footer de page.
  */
var Footer = React.createClass({
  render: function() {
    return (
      <footer className="page-footer">
        <div className="container">
          <div className="row">
            <div className="col l6 s12">
              <h5 className="white-text">Informations</h5>
              <p className="grey-text text-lighten-4">
                Ce site est un site personnel. Les données ne sont en rien garanties.<br /> Elles proviennent du site Open Data du Gouvernement.
              </p>
            </div>
            <div className="col l4 offset-l2 s12">
              <h5 className="white-text">Liens externes</h5>
              <ul>
                <li><a className="grey-text text-lighten-3" href="https://www.data.gouv.fr/fr/datasets/base-de-donnees-publique-des-medicaments-base-officielle/">Base de données Data.gouv.fr</a></li>
                <li><a className="grey-text text-lighten-3" href="http://sebastien.prevost31.free.fr">@sebprev</a></li>
                <li><a className="grey-text text-lighten-3" href="https://developers.openshift.com/en/node-js-overview.html">NodeJS sur OpenShift</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <div className="container">
            © 2016 Web Muret
            <a className="grey-text text-lighten-4 right" href="mailto:webmuret@gmail.com">Nous contacter</a>
          </div>
        </div>
      </footer>
    )
  }
});

/*
 * Fenêtre modale contentant le détail d'un médicament
 */
var DetailMedicament = React.createClass({
  loadMedicamentFromServer: function(id) {
    $.ajax({
      url: "/ws/medoc/" + id,
      dataType: 'json',
      cache: true,
      success: function(data) {
        this.setState({data: data[0]});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("/ws/medoc/" + id, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: {}};
  },
  closeModal: function(event) {
    $('#medicamentdetail').closeModal();
  },
  handleShowDetail: function(event) {
      $('#medicamentdetail').openModal();
      this.loadMedicamentFromServer(event.detail);
      event.preventDefault();
  },
  componentDidMount: function() {
    $('.collapsible').collapsible({
      accordion : false 
    });
    window.addEventListener("showDetail", this.handleShowDetail);
  },
  render: function() {
    var detail = <p>Non renseigné</p>;
    if (this.state.data.presentations) {
       detail = this.state.data.presentations.map(function(element, i) {
          var endDate = element.marketing_stop_date ? element.marketing_stop_date : ' ?';
          var cipCodes = element.cip_codes ? element.cip_codes.join(' / ') : ' ?';
          var generics = element.generic_groups ? element.generic_groups[0] : 'Non renseigné';
          return <p key={i} >
                <b>Titre</b>: {element.title} <br />
                <b>Date de mise en vente (Année / mois / jour)</b>: {element.marketing_start_date} <br />
                <b>Date de fin de vente (Année / mois / jour)</b>: {endDate} <br />
                <b>Prix</b>: {element.price}€<br />
                <b>Taux de remboursement</b>: {element.refund_rate}<br />
                <b>Codes CIP</b>: {cipCodes}<br />
                <b>Famille générique</b> : {generics}
            </p>;
        });
    }

    var composition = <p>Non renseigné</p>;
    if (this.state.data.composition) {
       composition = this.state.data.composition.map(function(element, i) {
          var composants = "";
          if (element.components) {
            for (i in element.components) {
              composants = ((composants === "") ? "" : (composants + ' - ')) + i + ' : ' + element.components[i];
            }
          }
          else {
            composants = "Non indiqués";
          }
          return <p key={i} >
                <b>Type</b>: {element.type} <br />
                <b>Quantité</b>: {element.quantity} <br />
                <b>Composants</b>: {composants}<br />
            </p>;
        });
    }

    var iab = <p>Non renseigné</p>;
    if (this.state.data.iab) {
      var tabIab = this.state.data.iab;
      if (this.state.data.iab_improvements) {
        tabIab = tabIab.concat(this.state.data.iab_improvements);
      }
      iab = tabIab.map(function(element, i) {
          return <p key={i} >
                <b>Résumé</b>: {element.abstract} <br />
                <b>Conseil</b>: {element.advice} <br />
                <b>Raison</b>: {element.reason}<br />
                <b>Valeur</b>: {element.value}<br />
            </p>;
        });
    }
    return (
      <div>
        <div id="medicamentdetail" className="modal">
          <div className="modal-content">
            <h4>Détail du médicament</h4>
              <ul className="collapsible" data-collapsible="accordion">
                <li>
                  <div className="collapsible-header active"><i className="material-icons">info_outline</i>Informations générales</div>
                  <div className="collapsible-body"><p><b>Identifiant</b>: {this.state.data.id} <br />
                    <b>Fabriquant</b>: {this.state.data.authorization_holder} <br />
                    <b>Nom</b>: {this.state.data.title} <br />
                    <b>Code CIS</b>: {this.state.data.cis_code}</p>
                  </div>
                </li>
                <li>
                  <div className='collapsible-header'><i className='material-icons'>playlist_add</i>Détail</div>
                  <div className='collapsible-body'>{detail}</div>
                </li>
                <li>
                  <div className="collapsible-header"><i className="material-icons">group_work</i>Composition</div>
                  <div className="collapsible-body">{composition}</div>
                </li>
                <li>
                  <div className="collapsible-header"><i className="material-icons">whatshot</i>IAB</div>
                  <div className="collapsible-body">{iab}</div>
                </li>
              </ul>
          </div>
          <div className="modal-footer">
            <a className="modal-action modal-close waves-effect waves-green btn-flat">OK</a>
          </div>
        </div>
      </div>
    )
  }
});

 /*
  * La fenêtre modale de recherche de médicaments.
  */
var RechercheModal = React.createClass({
  closeModal: function(event) {
    $('#recherche').closeModal();
  },
  entrerClavier: function(event) {
      // Si on tape sur entrée lors de la saisie d'un médoc, on effectue la recherche directement.
      if (event.charCode === 13) {
        this.afficherPage(event);
      }
  },
  afficherPage: function(event) {
    event.preventDefault();

    var medicSaisi = document.getElementById('inputMedicament').value;

    if (medicSaisi) {
      var params = [];
      params['pageSuivante'] = 'medicaments';
      params['medic'] = medicSaisi;

      Materialize.toast('Recherche en cours :&nbsp;<div style="color:red">' + medicSaisi + '</div>', 3000, 'rounded');
      $("#recherche").closeModal();

      this.props.changerPage(params);
    }
  },
  render: function() {
    return (
      <div>
        <div id="recherche" className="modal">
          <div className="modal-content">
            <h4>Recherche de médicaments</h4>
              <div className="row">
                <form className="col s12">
                  <div className="row">
                    <div className="input-field col s6">
                      <i className="material-icons prefix">account_circle</i>
                      <input id="inputMedicament" type="text" className="validate" onKeyPress={this.entrerClavier} />
                      <label htmlFor="icon_prefix">Saisir ici le médicament</label>
                    </div>
                  </div>
                </form>
              </div>
          </div>
          <div className="modal-footer">
            <a onClick={this.afficherPage} className="modal-action modal-close waves-effect waves-green btn-flat">Rechercher</a>
            <a onClick={this.closeModal} className="modal-action modal-close waves-effect waves-green btn-flat">Annuler</a>
          </div>
        </div>
      </div>
    )
  }
});

 /*
  * L'affichage particulier d'un fabriquant.
  */
var Fabriquant = React.createClass({
   afficherPage: function(event) {
      event.preventDefault();

      var params = [];
      params['pageSuivante'] = 'medocsPasFabriquants';
      params['fabriquant'] = this.props.data._id;

      this.props.changerPage(params);
  },
  render: function() {
    return (
      <a className="collection-item" onClick={this.afficherPage} >
        {this.props.data._id}
        <span className="badge">{this.props.data.count}</span>
      </a>
    );
  }
});

 /*
  * L'affichage particulier d'un médicament dans la table.
  */
var Medicament = React.createClass({
  afficherDetail: function(event) {
    window.dispatchEvent(new CustomEvent('showDetail', { 'detail': this.props.data.id }));
  },
  render: function() {
    return (
       <tr onClick={this.afficherDetail} >
        <td>{this.props.data.id}</td>
        <td>{this.props.data.authorization_holder}</td>
        <td>{this.props.data.title}</td>
        <td>{this.props.data.cis_code}</td>
      </tr>
    );
  }
});

var FabriquantList = React.createClass({
  getInitialState: function() {
    return {
      filterText: ''
    };
  },
  entrerClavier: function(event) {
      var text = event.target.value;
      this.setState({
        filterText: text
      });
  },
  render: function() {
    var changerPage = this.props.changerPage;
    var text = this.state.filterText;
    var filteredFab = this.props.data.filter(function(e){
      if (text === '') {
        return true;
      }
      if (e !==null && e._id !== null) {
        return (e._id.toLowerCase().indexOf(text.toLowerCase()) !== -1);
      }
    });
    var fabNodes = filteredFab.map(function(fabriquant) {
      return (
        <Fabriquant key={fabriquant._id} data={fabriquant} changerPage={changerPage} />
      );
    });
    return (
      <div className="row">
        <div className="input-field col s4 offset-s2">
          <i className="material-icons prefix">account_circle</i>
          <input id="filtrerfabriquants" type="text" className="validate" onChange={this.entrerClavier} />
          <label htmlFor="icon_prefix">Filtrer</label>
        </div>
        <div className="col s8 offset-s2">
          <div className="collection">
            {fabNodes}
          </div>
        </div>
      </div>
    );
  }
});

var MedocList = React.createClass({
  render: function() {
    var changerPage = this.props.changerPage;
    var medocNodes = this.props.data.map(function(medoc) {
      return (
        <Medicament key={medoc._id} data={medoc} changerPage={changerPage} />
      );
    });
    return (
      <div className="row">
        <div className="col s10 offset-s1">
          <table id="medoclist" className="bordered centered highlight responsive-table z-depth-3">
            <thead>
              <tr>
                  <th data-field="id">Identifiant</th>
                  <th data-field="fabriquant">Fabriquant</th>
                  <th data-field="title">Nom</th>
                  <th data-field="ciscode">Code CIS</th>
              </tr>
            </thead>
            <tbody>
              {medocNodes}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

 /*
  * La box dans laquelle on va afficher les fabriquants.
  */
var FabriquantsBox = React.createClass({
  loadFabriquantsFromServer: function() {
    $.ajax({
      url: "/ws/medocs/fabriquants",
      dataType: 'json',
      cache: true,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("/ws/medocs/fabriquants", status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadFabriquantsFromServer();
  },

  render: function() {
    var span1 = "Cette page liste l'ensemble des fournisseurs de médicaments listés sur ce site.";
    var span2 = "Le nombre de médicaments répertoriés pour chacun d'entre eux est aussi affiché.";
    var span3 = "En sélectionnant un fabriquant, vous verrez le détail des médicaments qu'il propose.";
    return (
      <div>
      <div className="row">
        <div className="col s6 offset-s3">
          <div className="card-panel grey">
            <span className="white-text">{span1}</span><br />
            <span className="white-text">{span2}</span><br />
            <span className="white-text">{span3}</span>
          </div>
        </div>
      </div>
      <FabriquantList data={this.state.data} changerPage={this.props.changerPage} />
      </div>
    );
  }
});

 /*
  * Les médicaments par fabriquant.
  */
var MedocsFabriquant = React.createClass({
  loadMedocsFromServer: function() {
    $.ajax({
      url: "/ws/medocs/fabriquantexact/" + this.props.fabriquant,
      dataType: 'json',
      cache: true,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("/ws/medocs/fabriquantexact/" + this.props.fabriquant, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadMedocsFromServer();
  },
  render: function() {
    var span1 = "Cette page liste l'ensemble des médicaments du fournisseur " + this.props.fabriquant + ".";
    var span2 = "En sélectionnant un médicament, vous en verrez le détail.";
    return (
        <div>
          <div className="row">
            <div className="col s6 offset-s3">
              <div className="card-panel grey">
                <span className="white-text">{span1}</span><br />
                <span className="white-text">{span2}</span>
              </div>
            </div>
          </div>
          <MedocList data={this.state.data} changerPage={this.props.changerPage} />
        </div>
      );
  }
});

 /*
  * Les médicaments dont le nom contient celui donné.
  */
var MedicamentsRecherche = React.createClass({
  loadMedocsFromServer: function(nom) {
    $.ajax({
      url: "/ws/medocs/medicament/" + nom,
      dataType: 'json',
      cache: true,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("/ws/medocs/medicament/" + nom, status, err.toString());
      }.bind(this)
    });
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.nom !== this.props.nom) {
      return this.loadMedocsFromServer(nextProps.nom);
    }
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadMedocsFromServer(this.props.nom);
  },
  render: function() {
    var span1 = "Cette page liste l'ensemble des médicaments dont le nom contient la saisie lors de la recherche.";
    var span2 = "En sélectionnant un médicament, vous en verrez le détail.";
    return (
        <div>
          <div className="row">
            <div className="col s6 offset-s3">
              <div className="card-panel grey">
                <span className="white-text">{span1}</span><br />
                <span className="white-text">{span2}</span>
              </div>
            </div>
          </div>
          <MedocList data={this.state.data} changerPage={this.props.changerPage} />
        </div>
      );
  }
});

 /*
  * Le panneau principal dans lequel on va gérer tout le contenu.
  */
var ContentBox = React.createClass({
  retourAccueil: function() {
    if (this.state.page !== "fabriquants") {
        this.setState({
        page        : "fabriquants"
      })
    }
    else {
      Materialize.toast('Vous êtes déjà sur la page', 3000, 'rounded');
    }
  },
  changerPage: function(params) {
    this.setState({
      page        : params['pageSuivante'],
      medoc       : params['medic'],
      fabriquant  : params['fabriquant']
    })
  },
  afficherPage: function() {
    switch (this.state.page) {
      case "fabriquants":
        return <FabriquantsBox changerPage={this.changerPage} />
      case "medicaments":
        return <MedicamentsRecherche nom={this.state.medoc} />
      case "medocsPasFabriquants":
        return <MedocsFabriquant fabriquant={this.state.fabriquant} />
    }
  },
  getInitialState: function() {
    return {
      page : "fabriquants"
    }
  },
  componentDidMount: function() {
    // Correction bug IHM (mauvaise initialisation des Tooltips)
    setTimeout(function() {
       $('.tooltipped').tooltip({delay: 50});
    }, 1000);
   
  },
  render: function() {
    return (
      <div>
        <NavBar retourAccueil={this.retourAccueil} />
        <InfoModal />
        <DetailMedicament />
        <RechercheModal changerPage={this.changerPage} />
        {this.afficherPage()}
        <Footer />
      </div>
    )
  }
});

ReactDOM.render(
  <ContentBox />,
  document.getElementById('content')
);