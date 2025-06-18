"use client";
import { useEffect, useState } from "react";

interface Item {
  id: number;
  name: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/items");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: Item[] = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con i pulsanti di navigazione */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex justify-end items-center">
            <div className="space-x-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-transparent rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log In
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Contenuto principale della pagina */}
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Items from Rocket API:
        </h1>
        <ul className="mt-6 space-y-4">
          {items.map(item => (
            <li 
              key={item.id} 
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              {item.name}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}