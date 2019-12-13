import React, { useState } from "react";
import { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/react-hooks";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import EditAuthor from "./components/EditAuthor";

const ALL_AUTHORS = gql`
  {
    allAuthors {
      name
      born
      id
    }
  }
`;

const ALL_BOOKS = gql`
  {
    allBooks {
      id
      title
      published
      author {
        name
      }
    }
  }
`;

const CREATE_BOOK = gql`
  mutation createBook(
    $title: String!
    $author: String!
    $published: Int!
    $genres: [String]!
  ) {
    addBook(
      title: $title
      author: $author
      published: $published
      genres: $genres
    ) {
      title
      published
      genres
    }
  }
`;

const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
    }
  }
`;

const App = () => {
  const [page, setPage] = useState("authors");
  const [errorMsg, setErrorMsg] = useState(null);

  const handleError = error => {
    console.log(error);
    setErrorMsg(error.graphQLErrors[0].message);
    setTimeout(() => {
      setErrorMsg(null);
    }, 5000);
  };

  const authors = useQuery(ALL_AUTHORS);
  const books = useQuery(ALL_BOOKS);

  const [addBook] = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_BOOKS }, { query: ALL_AUTHORS }]
  });

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  return (
    <div>
      {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("add")}>add book</button>
      </div>

      <Authors show={page === "authors"} result={authors} />
      <EditAuthor
        show={page === "authors"}
        authors={authors}
        editAuthor={editAuthor}
      />

      <Books show={page === "books"} result={books} />

      <NewBook show={page === "add"} addBook={addBook} />
    </div>
  );
};

export default App;
