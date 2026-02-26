import { useState, useRef, useEffect } from "react";
import { searchIngredients as searchLocal } from "../data/ingredientDatabase";
import { searchIngredients as searchApi, checkBackendHealth } from "../services/api";

export default function IngredientInput({
  index,
  ingredient,
  onUpdate,
  onRemove,
  canRemove,
}) {
  const [query, setQuery] = useState(ingredient.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useBackend, setUseBackend] = useState(false);
  const wrapperRef = useRef(null);

  // Sync local query when parent sets ingredient name externally (e.g. example buttons)
  useEffect(() => {
    setQuery(ingredient.name || "");
  }, [ingredient.name]);

  useEffect(() => {
    checkBackendHealth().then((h) => setUseBackend(h.available));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNameChange(e) {
    const value = e.target.value;
    setQuery(value);
    onUpdate(index, { ...ingredient, name: value, matched: false });

    if (value.trim().length >= 1) {
      let results;
      if (useBackend) {
        try {
          results = await searchApi(value);
          // Normalize backend format to match local format for display
          results = results.map((r) => ({
            ...r,
            niosh: r.nioshTable ? r.nioshTable.toLowerCase().replace("_", " ") : "none",
          }));
        } catch {
          results = searchLocal(value);
        }
      } else {
        results = searchLocal(value);
      }
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelect(item) {
    setQuery(item.name);
    setShowSuggestions(false);
    onUpdate(index, { ...ingredient, name: item.name, matched: true, data: item });
  }

  function handleKeyDown(e) {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function handleQuantityChange(e) {
    onUpdate(index, { ...ingredient, quantity: e.target.value });
  }

  // Normalize quantity on blur: collapse multiple spaces, trim whitespace
  // so "20 g  per  100 g" and "20g per 100g" both become "20g per 100g"
  function handleQuantityBlur(e) {
    const normalized = e.target.value
      .trim()
      .replace(/\s+/g, " ")           // collapse multiple spaces to one
      .replace(/(\d)\s+([a-zA-Z])/g, "$1$2")  // remove space between number and unit: "20 g" → "20g"
      .replace(/([a-zA-Z])\s+(\d)/g, "$1 $2"); // keep space between unit and number: "per 100g"
    onUpdate(index, { ...ingredient, quantity: normalized });
  }

  return (
    <div className="ingredient-row" ref={wrapperRef}>
      <div className="ingredient-header">
        <span className="ingredient-label">Ingredient {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="btn-remove-ingredient"
            onClick={() => onRemove(index)}
            title="Remove ingredient"
          >
            &times;
          </button>
        )}
      </div>
      <div className="ingredient-fields">
        <div className="ingredient-name-wrapper">
          <input
            type="text"
            className={`input-field ingredient-name ${ingredient.matched ? "matched" : ""}`}
            placeholder="Start typing ingredient name..."
            value={query}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            autoComplete="off"
          />
          {ingredient.matched && (
            <span className="match-indicator" title="Matched from database">
              DB
            </span>
          )}
          {showSuggestions && (
            <ul className="suggestions-dropdown">
              {suggestions.map((item, i) => {
                const nioshVal = (item.nioshTable || item.niosh || "none").toLowerCase();
                const isHazardous = nioshVal !== "none";
                return (
                  <li
                    key={item.id}
                    className={`suggestion-item ${i === selectedIndex ? "selected" : ""} ${isHazardous ? "hazardous" : ""}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="suggestion-name">{item.name}</span>
                    {isHazardous ? (
                      <span className="suggestion-badge niosh-badge">
                        NIOSH {nioshVal.replace("_", " ").replace("table ", "Table ").toUpperCase()}
                      </span>
                    ) : (
                      <span className="suggestion-badge safe-badge">
                        Non-hazardous
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <input
          type="text"
          className="input-field ingredient-quantity"
          placeholder="e.g. 400mg per unit"
          value={ingredient.quantity || ""}
          onChange={handleQuantityChange}
          onBlur={handleQuantityBlur}
        />
      </div>
    </div>
  );
}
