
# Add FLASK_APP env (linux/mac)

```console
$ env FLASK_APP=main.py
```

# Add FLASK_APP env (windows)

```console
$ set FLASK_APP=main.py
```

# Start server

Start server on port 5000

```console
$ FLASK_APP=app.py FLASK_DEBUG=1 python -m flask run --host=0.0.0.0
```

# Client

```console
$ curl -X POST -F "file=@resources/images_test.jpg" localhost:5000/upload
Success!
```
