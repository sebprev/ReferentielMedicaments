var Fabriquant = React.createClass({
  render: function() {
    return (
      <a href="#!" className="collection-item">
        {this.props.nom}
        <span className="badge">
          {this.props.nb}
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
      <div className="commentBox">
        <h1>Fabriquants</h1>
        <FabriquantList data={this.state.data} />
      </div>
    );
  }
});

var FabriquantList = React.createClass({
  render: function() {
    var fabNodes = this.props.data.map(function(fabriquant) {
      return (
        <Fabriquant nom={fabriquant._id} nb={fabriquant.count}>
        </Fabriquant>
      );
    });
    return (
      <div className="collection">
        {fabNodes}
      </div>
    );
  }
});

ReactDOM.render(
  <FabriquantsBox url="/ws/medocs/fabriquants" />,
  document.getElementById('content')
);