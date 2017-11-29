import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Recorder from './recorder.jsx'

class App extends Component {
    componentDidMount(){
    }
    render() {
        return (
            <div>
                <Recorder/>
            </div>
        )
    }
}



function render()
{
ReactDOM.render(
    <App />,
    document.getElementById('base')
    );
}

render();
