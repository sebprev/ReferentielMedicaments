var Fabriquant = React.createClass({
  render: function() {
    return (
      <a href="#!" className="collection-item">
        {this.props.data._id}
        <span className="badge">
          {this.props.data.count}
        </span>
      </a>
    );
  }
});

var FabriquantsBox = React.createClass({
  loadFabriquantsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: true,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
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
    return (
      <div>
      <div className="row">
        <div className="col s6 offset-s3">
          <div className="card-panel grey">
            <span className="white-text">Cette page liste l'ensemble des fournisseurs de médicaments listés sur ce site. </span><br />
            <span className="white-text">Le nombre de médicaments répertoriés pour chacun d'entre eux est aussi affiché. </span><br />
            <span className="white-text">En sélectionnant un fabriquant, vous verrez le détail des médicaments qu'il propose.</span>
          </div>
        </div>
      </div>
      <FabriquantList data={this.state.data} />
      </div>
    );
  }
});

var FabriquantList = React.createClass({
  render: function() {
    var fabNodes = this.props.data.map(function(fabriquant) {
      return (
        <Fabriquant key={fabriquant._id} data={fabriquant} />
      );
    });
    return (
      <div className="row">
        <div className="col s8 offset-s2">
          <div className="collection">
            {fabNodes}
          </div>
        </div>
      </div>
    );
  }
});

ReactDOM.render(
  <FabriquantsBox url="/ws/medocs/fabriquants" />,
  document.getElementById('content')
);