import React from 'react';
import MenuTableCell from './MenuTableCell/MenuTableCell';

const MenuTableRow = ({mealName, numberOfDays}) => {
  const cells = [];
  for (let i = 0; i < numberOfDays; i++) {
    cells.push(<MenuTableCell key={i} />);
  }
  return (
    <tr>
      <th scope="row">{mealName}</th>
      {cells}
    </tr>
  );
};

export default MenuTableRow;