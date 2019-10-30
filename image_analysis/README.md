
# Add FLASK_APP env (linux/mac)

```console
$ env FLASK_APP=main.py
$
```

# Add FLASK_APP env (windows)

```console
$ set FLASK_APP=main.py
$
```

# Start server

Start server on port 5000

```console
$ flask run
* Serving Flask app "main.py" (lazy loading)
* Environment: development
* Debug mode: on
* Restarting with stat
* Debugger is active!
* Debugger PIN: 302-116-947
* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```

# Client

```console
$ curl -X POST -F "file=@resources/images_test.jpg" localhost:5000/upload
Success!
```
