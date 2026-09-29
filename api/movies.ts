import { apiRequest } from './client';

export type MovieCard = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  year: string | null;
  mediaType: 'movie' | 'tv';
  trailerYoutubeId: string | null;
};

export type MovieCatalogRow = {
  id: string;
  title: string;
  items: MovieCard[];
};

export type MovieDetail = MovieCard & {
  runtimeMinutes: number | null;
  genres: string[];
};

export async function fetchMovieCatalog() {
  return apiRequest<{ rows: MovieCatalogRow[] }>('/movies/catalog', 'GET');
}

export async function fetchMovieDetail(
  tmdbId: number,
  mediaType: 'movie' | 'tv' = 'movie',
) {
  const q = mediaType === 'tv' ? '?type=tv' : '?type=movie';
  return apiRequest<MovieDetail>(`/movies/${tmdbId}${q}`, 'GET');
}

export async function fetchSimilarMovies(
  tmdbId: number,
  mediaType: 'movie' | 'tv' = 'movie',
) {
  const q = mediaType === 'tv' ? '?type=tv' : '?type=movie';
  return apiRequest<{ items: MovieCard[] }>(`/movies/${tmdbId}/similar${q}`, 'GET');
}
