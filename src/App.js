import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const tempMovieData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  },
  {
    imdbID: "tt0133093",
    Title: "The Matrix",
    Year: "1999",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
  },
  {
    imdbID: "tt6751668",
    Title: "Parasite",
    Year: "2019",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
  },
];

const tempWatchedData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    runtime: 148,
    imdbRating: 8.8,
    userRating: 10,
  },
  {
    imdbID: "tt0088763",
    Title: "Back to the Future",
    Year: "1985",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BZmU0M2Y1OGUtZjIxNi00ZjBkLTg1MjgtOWIyNThiZWIwYjRiXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
    runtime: 116,
    imdbRating: 8.5,
    userRating: 9,
  },
];

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "8e01da8";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const numResults = movies.length;

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok)
            throw new Error("Something went wrong when fetching movies");

          const data = await res.json();

          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.Search);
          setError("");
        } catch (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
            console.log(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }

      setSelectedId(null);
      fetchMovies();
      return () => {
        controller.abort();
      };
    },
    [query]
  );

  function handleSelectMovie(id) {
    setSelectedId(id);
  }

  return (
    <>
      <Navbar>
        <Search query={query} setQuery={setQuery} />
        <NumResults num={numResults} />
      </Navbar>
      <main className="main">
        <Movielist>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <ul className="list list-movies">
              {movies?.map((movie) => (
                <Movie
                  movie={movie}
                  key={movie.imdbID}
                  onClick={() => handleSelectMovie(movie.imdbID)}
                >
                  <p>
                    <span>📅</span>
                    <span>{movie.Year}</span>
                  </p>
                </Movie>
              ))}
            </ul>
          )}
          {error && <ErrorMessage message={error} />}
        </Movielist>

        <Movielist movieSelected={selectedId} setMovieSelected={setSelectedId}>
          {selectedId ? (
            <MovieDetails
              key={selectedId}
              id={selectedId}
              watched={watched}
              setWatched={setWatched}
              setMovieSelected={setSelectedId}
            />
          ) : (
            <Watchedlist watched={watched} setWatched={setWatched} />
          )}
        </Movielist>
      </main>
    </>
  );
}

function Movie({ movie, onClick, children }) {
  return (
    <li key={movie.imdbID} onClick={onClick}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>{children}</div>
    </li>
  );
}

function MovieDetails({ id, watched, setWatched, setMovieSelected }) {
  const [movie, setMovie] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const prevRated = watched.filter((movie) => movie.imdbID === id)[0];

  useEffect(
    function () {
      async function getMovieDetails() {
        try {
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&i=${id}`
          );
          if (!res.ok)
            throw new Error("Something went wrong when fetching movies");

          const data = await res.json();

          if (data.Response === "False") throw new Error("Movie not found");

          setMovie(data);
        } catch {
        } finally {
        }
      }
      getMovieDetails();
    },
    [id]
  );

  useEffect(
    function () {
      if (!movie.Title) return;
      document.title = `MOVIE | ${movie.Title}`;
      return () => {
        document.title = "usePopcorn";
      };
    },
    [movie.Title]
  );

  useEffect(() => {
    function callback(e) {
      if (e.code === "Escape") {
        setMovieSelected(null);
      }
    }
    document.addEventListener("keydown", callback);
    return () => {
      document.removeEventListener("keydown", callback);
    };
  }, [setMovieSelected]);

  function handleAddToList() {
    const numericalValue = movie.Runtime.match(/\d+/);
    const runtimeInMinutes = numericalValue
      ? parseInt(numericalValue[0], 10)
      : null;
    const newMovie = {
      Poster: movie.Poster,
      Title: movie.Title,
      imdbRating: movie.imdbRating,
      userRating: userRating,
      runtime: runtimeInMinutes,
      imdbID: movie.imdbID,
    };
    setWatched((watched) => [...watched, newMovie]);
    setMovieSelected(null);
  }

  return (
    <div className="details">
      <header>
        <img src={movie.Poster} alt={`${movie.Title} poster`} />
        <div className="details-overview">
          <h2>{movie.Title}</h2>
          <p>
            {movie.Released} • {movie.Runtime}
          </p>
          <p>{movie.Genre}</p>
          <p>
            <span>⭐</span> {movie.imdbRating} IMDb rating
          </p>
        </div>
      </header>
      <section>
        <div className="rating">
          {prevRated ? (
            <>You rated this movie a ⭐ {prevRated.userRating}</>
          ) : (
            <>
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={(rating) => setUserRating(rating)}
              />
              {userRating ? (
                <button className="btn-add" onClick={handleAddToList}>
                  + Add to list
                </button>
              ) : (
                ""
              )}
            </>
          )}
        </div>
        <p>
          <em>{movie.Plot}</em>
        </p>
        <p>Starring: {movie.Actors}</p>
        <p>Directed by: {movie.Director}</p>
      </section>
    </div>
  );
}

function Navbar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResults({ num }) {
  return (
    <p className="num-results">
      Found <strong>{num || 0}</strong> results
    </p>
  );
}

function Movielist({ movieSelected, setMovieSelected, children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      {movieSelected ? (
        <button className="btn-back" onClick={() => setMovieSelected(null)}>
          ←
        </button>
      ) : (
        ""
      )}
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function Watchedlist({ watched, setWatched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  function handleRemoveMovie(id) {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
  }

  return (
    <>
      <div className="summary">
        <h2>Movies you watched</h2>
        <div>
          <p>
            <span>#️⃣</span>
            <span>{watched.length} movies</span>
          </p>
          <p>
            <span>⭐️</span>
            <span>{avgImdbRating.toFixed(2)}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{avgUserRating.toFixed(2)}</span>
          </p>
          <p>
            <span>⏳</span>
            <span>{avgRuntime.toFixed(0)} min</span>
          </p>
        </div>
      </div>
      <ul className="list">
        {watched.map((movie) => (
          <Movie movie={movie} key={movie.imdbID}>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>
            <button
              className="btn-delete"
              onClick={() => handleRemoveMovie(movie.imdbID)}
            >
              X
            </button>
          </Movie>
        ))}
      </ul>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⚠️</span> {message}
    </p>
  );
}
