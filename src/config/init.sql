CREATE DATABASE OSRS_DB;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "OSRS_Inventory" (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "itemId" integer NOT NULL,
    "userId" uuid NOT NULL,
    "iconUrl" character varying NOT NULL,
    description character varying NOT NULL,
    name character varying NOT NULL
);

ALTER TABLE "OSRS_Inventory" OWNER TO postgres;

CREATE TABLE "OSRS_Users" (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    username character varying(12) NOT NULL,
    password character varying NOT NULL,
    "profilePicId" integer NOT NULL
);

ALTER TABLE "OSRS_Users" OWNER TO postgres;

ALTER TABLE ONLY "OSRS_Users"
    ADD CONSTRAINT "PK_988d8fac416f84fcf5d7f66ecc5" PRIMARY KEY (id);

ALTER TABLE ONLY "OSRS_Inventory"
    ADD CONSTRAINT "PK_a5ab45df12eae4b0c3f23e8777b" PRIMARY KEY (id);

ALTER TABLE ONLY "OSRS_Users"
    ADD CONSTRAINT "UQ_3fabc8e1da7864d9c3063ef715b" UNIQUE (username);

ALTER TABLE ONLY "OSRS_Inventory"
    ADD CONSTRAINT "FK_c935401b1718bf5c22927f8b6f7" FOREIGN KEY ("userId") REFERENCES "OSRS_Users"(id);
