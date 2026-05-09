BEGIN;


CREATE TABLE IF NOT EXISTS public."Chat_Logs"
(
    id serial NOT NULL,
    user_id integer NOT NULL,
    message text COLLATE pg_catalog."default" NOT NULL,
    response text COLLATE pg_catalog."default",
    "timestamp" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_Logs_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."Destination_Tags"
(
    destination_id integer NOT NULL,
    tag_id integer NOT NULL,
    CONSTRAINT "Destination_Tags_pkey" PRIMARY KEY (destination_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public."Destinations"
(
    id serial NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    country character varying(255) COLLATE pg_catalog."default" NOT NULL,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    image_url text COLLATE pg_catalog."default",
    country_en text COLLATE pg_catalog."default",
    description_en text COLLATE pg_catalog."default",
    source character varying(50) COLLATE pg_catalog."default",
    source_id character varying(100) COLLATE pg_catalog."default",
    user_submitted boolean DEFAULT false,
    submitted_by integer,
    CONSTRAINT "Destinations_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."Itineraries"
(
    id serial NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    start_date date,
    end_date date,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    destination character varying(255) COLLATE pg_catalog."default",
    name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT "Itineraries_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."Itinerary_Items"
(
    id serial NOT NULL,
    itinerary_id integer NOT NULL,
    destination_id integer NOT NULL,
    day_number integer NOT NULL DEFAULT 1,
    order_index integer,
    category character varying(50) COLLATE pg_catalog."default" DEFAULT 'other'::character varying,
    CONSTRAINT "Itinerary_Items_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."Tags"
(
    id serial NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "Tags_pkey" PRIMARY KEY (id),
    CONSTRAINT uq_tags_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public."User_Map_Status"
(
    id serial NOT NULL,
    user_id integer NOT NULL,
    destination_id integer NOT NULL,
    status character varying(255) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rating smallint,
    source character varying(10) COLLATE pg_catalog."default" DEFAULT 'city'::character varying,
    CONSTRAINT "User_Map_Status_pkey" PRIMARY KEY (id),
    CONSTRAINT uq_user_map_status_user_dest UNIQUE (user_id, destination_id)
);

CREATE TABLE IF NOT EXISTS public."User_Preferences"
(
    id serial NOT NULL,
    user_id integer NOT NULL,
    tag_id integer NOT NULL,
    score integer NOT NULL DEFAULT 0,
    CONSTRAINT "User_Preferences_pkey" PRIMARY KEY (id),
    CONSTRAINT uq_user_preferences_user_tag UNIQUE (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public."Users"
(
    id serial NOT NULL,
    username character varying(255) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    slider_preferences jsonb,
    CONSTRAINT "Users_pkey" PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

ALTER TABLE IF EXISTS public."Chat_Logs"
    ADD CONSTRAINT fk_chat_logs_user FOREIGN KEY (user_id)
    REFERENCES public."Users" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."Destination_Tags"
    ADD CONSTRAINT fk_destination_tags_destination FOREIGN KEY (destination_id)
    REFERENCES public."Destinations" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."Destination_Tags"
    ADD CONSTRAINT fk_destination_tags_tag FOREIGN KEY (tag_id)
    REFERENCES public."Tags" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."Destinations"
    ADD CONSTRAINT "Destinations_submitted_by_fkey" FOREIGN KEY (submitted_by)
    REFERENCES public."Users" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public."Itineraries"
    ADD CONSTRAINT fk_itineraries_user FOREIGN KEY (user_id)
    REFERENCES public."Users" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."Itinerary_Items"
    ADD CONSTRAINT fk_items_destination FOREIGN KEY (destination_id)
    REFERENCES public."Destinations" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS public."Itinerary_Items"
    ADD CONSTRAINT fk_items_itinerary FOREIGN KEY (itinerary_id)
    REFERENCES public."Itineraries" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."User_Map_Status"
    ADD CONSTRAINT fk_user_map_status_destination FOREIGN KEY (destination_id)
    REFERENCES public."Destinations" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."User_Map_Status"
    ADD CONSTRAINT fk_user_map_status_user FOREIGN KEY (user_id)
    REFERENCES public."Users" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."User_Preferences"
    ADD CONSTRAINT fk_user_preferences_tag FOREIGN KEY (tag_id)
    REFERENCES public."Tags" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public."User_Preferences"
    ADD CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id)
    REFERENCES public."Users" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;

END;