import React, { useState, useEffect } from "react";
import { useApolloClient } from "@apollo/react-hooks";

const Favorites = ({ show, activeUser, booksQuery }) => {
  const client = useApolloClient();
  const [booksToShow, setBooksToShow] = useState([]);

  useEffect(() => {
    filterBooks(activeUser.favoriteGenre);
    // eslint-disable-next-line
  }, []);

  const filterBooks = async filterGenre => {
    const { data } = await client.query({
      query: booksQuery,
      variables: { genre: filterGenre }
    });
    setBooksToShow(data.allBooks);
  };

  if (!show) {
    return null;
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
          {booksToShow &&
            booksToShow.map(a => (
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
