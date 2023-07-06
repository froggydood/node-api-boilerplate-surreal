BEGIN TRANSACTION;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string ASSERT $value != NONE AND $value != NULL;
DEFINE INDEX user_username_idx ON user FIELDS username UNIQUE;

DEFINE FIELD email ON user TYPE string ASSERT $value != NONE AND $value != NULL;
DEFINE INDEX user_email_idx ON user FIELDS email UNIQUE;

DEFINE FIELD firstName ON user TYPE string ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD lastName ON user TYPE string ASSERT $value != NONE AND $value != NULL;

DEFINE FIELD passwordHash ON user TYPE string ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD joinedAt ON user TYPE datetime VALUE time::now() ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD role ON user TYPE string VALUE "user" ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD verified ON user TYPE bool VALUE false ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD permissions ON user TYPE array VALUE [] ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD permissions.* ON user TYPE string ASSERT $value != NONE AND $value != NULL;

DEFINE TABLE userToken SCHEMAFULL;
DEFINE FIELD userId ON userToken TYPE record(user) ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD token ON userToken TYPE string VALUE rand::uuid() ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD createdAt ON userToken TYPE datetime VALUE time::now() ASSERT $value != NONE AND $value != NULL;
DEFINE FIELD type ON userToken TYPE string ASSERT $value != NULL AND $value != NULL;

COMMIT TRANSACTION;