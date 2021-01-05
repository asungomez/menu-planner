import React from 'react';
import MenuTableRow from './MenuTableRow/MenuTableRow';

const MenuTable = () => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Meal</th>
          <th scope="col">Monday</th>
          <th scope="col">Tuesday</th>
          <th scope="col">Wednesday</th>
          <th scope="col">Thursday</th>
          <th scope="col">Friday</th>
          <th scope="col">Saturday</th>
          <th scope="col">Sunday</th>
        </tr>
      </thead>
      <tbody>
        <MenuTableRow mealName='Breakfast' numberOfDays={7} />
        <MenuTableRow mealName='Morning snack' numberOfDays={7} />
        <MenuTableRow mealName='Lunch' numberOfDays={7} />
        <MenuTableRow mealName='Afternoon snack' numberOfDays={7} />
        <MenuTableRow mealName='Dinner' numberOfDays={7} />
      </tbody>
    </table>
  );
};

export default MenuTable;