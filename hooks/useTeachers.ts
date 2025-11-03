import useSWR from "swr";

export interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  telephone: string;
  email: string;
  type: string;
  grade: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTeachers() {
  const { data, error, isLoading, mutate } = useSWR<Teacher[]>(
    "/api/enseignants",
    fetcher
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
