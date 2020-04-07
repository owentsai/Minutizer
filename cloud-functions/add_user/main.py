import os
import sys
import sqlalchemy
import logging

db = sqlalchemy.create_engine(
    sqlalchemy.engine.url.URL(
        drivername="mysql+pymysql",
        username=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASS"),
        database=os.environ.get("DB_NAME"),
        query={"unix_socket": "/cloudsql/{}".format(os.environ.get("CLOUD_SQL_CONNECTION_NAME"))},
    )
)

logger = logging.getLogger()

# function triggered by firebase when a new user is created
def add_user(event, context):
     email = event['email']
     try:
          with db.connect() as conn:
               row = conn.execute("INSERT INTO User (email)" " VALUES (%s)", (email))
     except Exception as e:
          logger.exception(e)

     return
