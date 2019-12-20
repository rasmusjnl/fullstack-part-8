import React, { useState, useEffect } from "react";

const Books = ({ show, result }) => {
  const [booksToShow, setBooksToShow] = useState([]);
  const [filter, setFilter] = useState("");
  const [uniqueGenres, setUniqueGenres] = useState([]);

  useEffect(() => {
    if (!result.loading) {
      setBooksToShow(result.data.allBooks);
      let genres = [];
      result.data.allBooks.map(book => {
        genres = genres.concat(book.genres);
        return genres;
      });
      setUniqueGenres([...new Set(genres)]);
    }
    // eslint-disable-next-line
  }, [result.loading]);

  if (!show) {
    return null;
  }
  if (result.loading) {
    return <div>Loading...</div>;
  }

  const handleFilter = genre => {
    if (genre) {
      setBooksToShow(
        result.data.allBooks.filter(book => book.genres.includes(genre))
      );
      setFilter(genre);
    } else {
      setBooksToShow(result.data.allBooks);
      setFilter("");
    }
  };

  return (
    <div>
      <h2>books</h2>
      {filter && <div>showing genre {filter}</div>}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow.map(a => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {uniqueGenres.map(genre => {
        return (
          <button key={genre} onClick={() => handleFilter(genre)}>
            {genre}
          </button>
        );
      })}
      <button onClick={() => handleFilter("")}>all genres</button>
    </div>
  );
};

export default Books;
