import React from 'react';
import MenuTable from '../MenuTable/MenuTable';
import './App.css';

const App = () => {
  return (
    <div className="page-wrapper">
      <div className="container-md main-container">
        <div className="d-flex flex-column justify-content-center align-items-center vertical-container">
          <div className="row">
            <div className="col-12">
              <MenuTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default App;
