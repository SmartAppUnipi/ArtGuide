# Start server (linux/mac)
Start server on port 5000
```
$ env FLASK_APP=main.py flask run
```
# Start server (linux/mac)
Start server on port 5000
```
$ set FLASK_APP=main.py flask run
```
# Client
```
curl -X POST -F "file=@resources/images_test.jpg" localhost:5000/upload
```

