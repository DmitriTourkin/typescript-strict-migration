// Точка входа: её подключает index.html.
import { startApp } from "./ui/app";
import "./style.css";

startApp(document.querySelector("#app"), { fetchFn: (url) => fetch(url) });
