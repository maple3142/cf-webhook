DROP TABLE IF EXISTS files;

DROP TABLE IF EXISTS requests;

CREATE TABLE
	files (
		path TEXT PRIMARY KEY,
		content TEXT NOT NULL,
		headers JSON NOT NULL
	);

CREATE TABLE
	requests (
		id TEXT PRIMARY KEY,
		method TEXT NOT NULL,
		path TEXT NOT NULL,
		search TEXT NOT NULL,
		headers JSON NOT NULL,
		body BLOB,
		date DATETIME NOT NULL
	);
