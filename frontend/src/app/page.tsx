"use client"; // This directive enables client-side rendering for this component

import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/items");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  return (
    <div>
    <h1>Items from Rocket API:</h1>
    <ul>
    {items.map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
    </ul>
    </div>
  );
}

