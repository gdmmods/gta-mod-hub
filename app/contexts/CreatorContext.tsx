"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

type CreatorContextType = {

  creatorId: string | null;

  setCreatorId: (
    creatorId: string
  ) => void;

};

const CreatorContext =
  createContext<
    CreatorContextType | undefined
  >(undefined);

export function CreatorProvider({

  children,

}: {
  children: React.ReactNode;
}) {

  const [
    creatorId,
    setCreatorId,
  ] = useState<string | null>(
    null
  );

  return (

    <CreatorContext.Provider
      value={{
        creatorId,
        setCreatorId,
      }}
    >

      {children}

    </CreatorContext.Provider>

  );

}

export function useCreatorContext() {

  const context =
    useContext(
      CreatorContext
    );

  if (!context) {

    throw new Error(
      "useCreatorContext must be used inside CreatorProvider"
    );

  }

  return context;

}