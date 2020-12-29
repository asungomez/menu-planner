import React, { useState } from 'react';

const MenuTableCell = () => {
  const [meal, setMeal] = useState('');
  const [editing, setEditing] = useState(false);

  const toggleEdition = () => setEditing(editing => !editing);

  const iconClass = editing ? 'bi-check2' : 'bi-pencil-square';

  return (
    <td>
      <div className="row">
        <div className="col-8">
          {
            editing 
              ? <input 
                type="text" 
                className="form-control" 
                value={meal} 
                onChange={e => setMeal(e.target.value)} 
              /> 
              : meal
          }
        </div>
        <div className="col-4">
          <button className="btn btn-outline-primary btn-sm" onClick={toggleEdition}>
            <i className={`bi ${iconClass}`}></i>
          </button>
        </div>
      </div>

    </td>
  );
};

export default MenuTableCell;