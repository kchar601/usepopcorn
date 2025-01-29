import { useEffect, useState, useRef } from "react";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";

const KEY = "8e01da8";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { movies, error, isLoading } = useMovies(query, setSelectedId);

  const numResults = movies.length;

  const [watched, setWatched] = useLocalStorageState([], "watched");

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

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

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
      countRatingDecisions: countRef.current,
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
  const inputEl = useRef(null);

  useEffect(() => {
    function callback(e) {
      if (document.activeElement === inputEl.current) return;

      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    }
    document.addEventListener("keydown", callback);
    return () => document.removeEventListener("keydown", callback);
  }, [setQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
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
