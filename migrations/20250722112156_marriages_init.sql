-- +goose Up
-- +goose StatementBegin
create table marriages (
    id integer primary key autoincrement,
    user1 bigint not null,
    user2 bigint null,
    createdAt datetime not null default current_timestamp,
    updatedAt datetime not null default current_timestamp
);

create unique index unique_marriage on marriages(user1, user2);
create unique index unique_marriage_reverse on  marriages(user2, user1);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table marriages;
drop index unique_marriage;
drop index unique_marriage_reverse;
-- +goose StatementEnd
