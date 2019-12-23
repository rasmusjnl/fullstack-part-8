import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";

const Books = ({ show, initialBooks, filterBooks }) => {
  const [filter, setFilter] = useState(null);
  const [uniqueGenres, setUniqueGenres] = useState([]);

  const { loading, data, refetch } = useQuery(filterBooks, {
    variables: filter && { genre: filter }
  });

  useEffect(() => {
    if (!initialBooks.loading) {
      let genres = [];
      initialBooks.data.allBooks.map(book => {
        genres = genres.concat(book.genres);
        return genres;
      });
      setUniqueGenres([...new Set(genres)]);
    }
  }, [initialBooks]);

  useEffect(() => {
    refetch();
  }, [filter, initialBooks, refetch]);

  if (!show) {
    return null;
  }
  if (loading) {
    return <div>Loading...</div>;
  }

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
          {data.allBooks.map(a => (
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
          <button key={genre} onClick={() => setFilter(genre)}>
            {genre}
          </button>
        );
      })}
      <button onClick={() => setFilter(null)}>All genres</button>
    </div>
  );
};

export default Books;
