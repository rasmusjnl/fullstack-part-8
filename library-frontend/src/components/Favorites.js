import React from "react";

const Favorites = ({ show, activeUser, favoriteBooks }) => {
  if (!show) {
    return null;
  }

  if (favoriteBooks.loading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h2>Recommendations</h2>
      <div>
        books in your favorite genre: <b>{activeUser.favoriteGenre}</b>
      </div>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {favoriteBooks.data.allBooks.map(a => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Favorites;
