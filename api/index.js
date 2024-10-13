import express from "express";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
  }),
);
// Serve static files from the React app
app.use(express.static(path.resolve("..", "dist")));

app.get("/songs", (req, res) => {
  res.status(200).json({
    songs: ["song1.mp3", "song2.mp3", "song3.mp3"],
  });
});

app.get("/audio/:name", (req, res) => {
  const musicPath = path.resolve("assets", req.params.name);
  const stat = fs.statSync(musicPath);

  const range = req.headers.range;
  let readStream;

  if (!range) {
    res.header({
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    });
    readStream = fs.createReadStream(musicPath);
    return readStream.pipe(res);
  }

  console.log({ range });
  const parts = range.replace(/bytes=/, "").split("-");
  console.log({ parts });

  const startRange = parseInt(parts[0], 10);
  const endRange = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

  const contentLength = endRange - startRange + 1;
  res.status(206).header({
    "Content-Type": "audio/mpeg",
    "Content-Length": contentLength,
    "Content-Range": "bytes " + startRange + "-" + endRange + "/" + stat.size,
  });

  readStream = fs.createReadStream(musicPath, {
    start: startRange,
    end: endRange,
  });

  readStream.pipe(res);
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve("dist", "index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server started on port 3000");
});
