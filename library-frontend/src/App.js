import React, { useState, useEffect } from "react";
import { gql } from "apollo-boost";
import {
  useQuery,
  useMutation,
  useApolloClient,
  useSubscription
} from "@apollo/react-hooks";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import EditAuthor from "./components/EditAuthor";
import LoginForm from "./components/LoginForm";
import Favorites from "./components/Favorites";

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
  query allBooks($genre: String, $author: String) {
    allBooks(genre: $genre, author: $author) {
      id
      title
      published
      author {
        name
      }
      genres
    }
  }
`;

const ACTIVE_USER = gql`
  {
    me {
      username
      favoriteGenre
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
      author {
        name
      }
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

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      title
      published
      author {
        name
      }
      genres
    }
  }
`;

const App = () => {
  const client = useApolloClient();
  const [activeUser, setActiveUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("authors");
  const [errorMsg, setErrorMsg] = useState(null);

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log(subscriptionData)
      window.alert(`New book "${subscriptionData.data.bookAdded.title}" added`);
    }
  });

  useEffect(() => {
    if (token) {
      getActiveUser();
    }
    // eslint-disable-next-line
  }, [token]);

  const getActiveUser = async () => {
    const { data } = await client.query({
      query: ACTIVE_USER
    });
    setActiveUser(data.me);
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage("authors");
  };

  const handleError = error => {
    console.log(error);
    setErrorMsg(error.graphQLErrors[0].message);
    setTimeout(() => {
      setErrorMsg(null);
    }, 5000);
  };

  const authors = useQuery(ALL_AUTHORS);
  const books = useQuery(ALL_BOOKS);
  const favoriteBooks = useQuery(
    ALL_BOOKS,
    activeUser && { variables: { genre: activeUser.favoriteGenre } }
  );

  const [addBook] = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [
      { query: ALL_BOOKS },
      { query: ALL_AUTHORS },
      {
        query: ALL_BOOKS,
        variables: activeUser && { genre: activeUser.favoriteGenre }
      }
    ]
  });

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  const [login] = useMutation(LOGIN, {
    onError: handleError
  });

  return (
    <div>
      {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token && (
          <button onClick={() => setPage("favorites")}>favorites</button>
        )}
        {token && <button onClick={() => setPage("add")}>add book</button>}
        <button onClick={token ? logout : () => setPage("login")}>
          {token ? "logout" : "login"}
        </button>
      </div>

      <LoginForm
        show={page === "login"}
        login={login}
        setToken={token => setToken(token)}
        setPage={setPage}
      />

      <Authors show={page === "authors"} result={authors} />
      {token && (
        <EditAuthor
          show={page === "authors"}
          authors={authors}
          editAuthor={editAuthor}
        />
      )}

      {activeUser && (
        <Favorites
          show={page === "favorites"}
          activeUser={activeUser}
          favoriteBooks={favoriteBooks}
        />
      )}

      <Books
        show={page === "books"}
        initialBooks={books}
        filterBooks={ALL_BOOKS}
      />

      <NewBook show={page === "add"} addBook={addBook} />
    </div>
  );
};

export default App;
