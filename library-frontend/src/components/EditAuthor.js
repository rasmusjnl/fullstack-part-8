import React, { useState } from "react";

const EditAuthor = ({ show, authors, editAuthor }) => {
  const [name, setName] = useState(null);
  const [born, setBorn] = useState("");

  if (!show) {
    return null;
  }

  const submit = async e => {
    e.preventDefault();
    const updatedAuthor = await editAuthor({
      variables: { name, setBornTo: parseInt(born, 10) }
    });
    console.log(updatedAuthor);
    setName("");
    setBorn("");
  };

  const handleChange = e => {
    setName(e.target.value);
  };

  return (
    <>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        {!authors.loading && (
          <select value={name} onChange={handleChange}>
            <option value={null} />
            {authors.data.allAuthors.map(author => (
              <option value={author.name}>{author.name}</option>
            ))}
          </select>
        )}
        <div>
          born{" "}
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </>
  );
};

export default EditAuthor;
