const { ApolloServer, gql, UserInputError } = require("apollo-server");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");

mongoose.set("useFindAndModify", false);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);

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

const typeDefs = gql`
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
    bookCount: Int!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (Object.keys(args).length === 2) {
        return books.filter(
          book =>
            book.author === args.author && book.genres.includes(args.genre)
        );
      } else if (args.author) {
        return books.filter(book => book.author === args.author);
      } else if (args.genre) {
        const booksByGenre = await Book.find({ genres: { $in: [args.genre] } });
        return booksByGenre;
      } else {
        return await Book.find({}).populate("author", { name: 1 });
      }
    },
    allAuthors: async () => {
      return await Author.find({});
    }
  },

  Mutation: {
    addBook: async (root, args) => {
      const foundAuthor = await Author.findOne({ name: args.author });
      if (foundAuthor) {
        const newBook = new Book({ ...args, author: { ...foundAuthor } });
        try {
          await newBook.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
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
        return newBook;
      }
    },
    editAuthor: async (root, args) => {
      const author = { name: args.name, born: args.setBornTo };
      const updatedAuthor = await Author.findOneAndUpdate(
        { name: args.name },
        author,
        { new: true }
      );
      return updatedAuthor;
    }
  },

  Author: {
    bookCount: async root => {
      const found = await Book.find({ author: { $in: [root.id] } });
      return found.length;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
