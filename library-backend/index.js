const { ApolloServer, gql, UserInputError, PubSub } = require("apollo-server");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const DataLoader = require("dataloader");

mongoose.set("useFindAndModify", false);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);

const pubsub = new PubSub();
const JWT_SECRET = "asd";
const MONGODB_URI =
  "mongodb+srv://fullstack666:password666@cluster0-tsmcv.mongodb.net/library?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log("Error connecting to MongoDB");
  });

const batchAuthors = async keys => {
  const books = await Book.find({});
  return keys.map(key => books.filter(book => book.author.toString() === key).length);
};

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Query {
    me: User
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    createUser(username: String!, favoriteGenre: String!): User

    login(username: String!, password: String!): Token

    addBook(title: String!, author: String!, published: Int!, genres: [String]!): Book

    editAuthor(name: String!, setBornTo: Int!): Author
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Query: {
    me: (root, args, context) => {
      return context.currentUser;
    },
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (Object.keys(args).length === 2) {
        return books.filter(
          book => book.author === args.author && book.genres.includes(args.genre)
        );
      } else if (args.author) {
        return books.filter(book => book.author === args.author);
      } else if (args.genre) {
        console.log(args.genre);
        const booksByGenre = await Book.find({
          genres: { $in: [args.genre] }
        }).populate("author", { name: 1 });
        return booksByGenre;
      } else {
        return await Book.find({}).populate("author", { name: 1 });
      }
    },
    allAuthors: async () => {
      console.log("Author query");
      return await Author.find({});
    }
  },

  Mutation: {
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      });
      return await user.save().catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if (!user || args.password !== "password") {
        throw new UserInputError("Invalid credentials!");
      }
      const userForToken = {
        username: user.username,
        id: user._id
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new UserInputError("Not logged in!");
      }
      const foundAuthor = await Author.findOne({ name: args.author });
      if (foundAuthor) {
        const newBook = new Book({ ...args, author: foundAuthor });
        try {
          await newBook.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        pubsub.publish("BOOK_ADDED", { bookAdded: newBook });
        return newBook;
      } else {
        const newAuthor = new Author({ name: args.author });
        const newBook = new Book({ ...args, author: newAuthor });
        try {
          await newAuthor.save();
          await newBook.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        pubsub.publish("BOOK_ADDED", { bookAdded: newBook });
        return newBook;
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new UserInputError("Not logged in!");
      }
      const author = { name: args.name, born: args.setBornTo };
      const updatedAuthor = await Author.findOneAndUpdate({ name: args.name }, author, {
        new: true
      });
      return updatedAuthor;
    }
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"])
    }
  },

  Author: {
    bookCount: async ({ id }, _args, { loaders }) => {
      return await loaders.authorLoader.load(id);
    }
  },

  Book: {
    author: root => {
      return {
        name: root.author.name
      };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser, loaders: { authorLoader: new DataLoader(keys => batchAuthors(keys)) } };
    }
    return { loaders: { authorLoader: new DataLoader(keys => batchAuthors(keys)) } };
  }
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
