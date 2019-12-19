# ArtGuide

| branch | build status |
|-|:-:|
| [master](https://github.com/SmartAppUnipi/ArtGuide/tree/master) | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=master)](https://travis-ci.com/SmartAppUnipi/ArtGuide) |
| [ui](https://github.com/SmartAppUnipi/ArtGuide/tree/ui) | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=ui)](https://travis-ci.com/SmartAppUnipi/ArtGuide/branches) |
| [ia_beta](https://github.com/SmartAppUnipi/ArtGuide/tree/ia_beta) | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=ia_beta)](https://travis-ci.com/SmartAppUnipi/ArtGuide/branches) |
| [ir](https://github.com/SmartAppUnipi/ArtGuide/tree/ir) | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=ir)](https://travis-ci.com/SmartAppUnipi/ArtGuide/branches) |
| [adaptation_proto](https://github.com/SmartAppUnipi/ArtGuide/tree/adaptation_proto) | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=adaptation_proto)](https://travis-ci.com/SmartAppUnipi/ArtGuide/branches) |

## Structure
The project is structured in 4 modules:
- [Mobile app](ui): developed with Flutter, provides apk and ipa to be installed on both Android and iOS.
- [Image analysis](image_analysis): recognize entities and styles present in the image.
- [Information Retrieval](ir): understand which kind of work of art is and retrieve information about that.
- [Adaptation](adaptation): summarize and customize the information for the user.

Each module has its own README with further information.


## How to run
Checkout the README.md files present in each module. You will need either Node.js and Python 3 or Docker (see below).

ENV variables with the API keys are needed, contact the teams to get them and please don't put them under version control.

### Docker
The [docker-compose.yml](docker-compose.yml) defines the containers settings.

Before running docker change [routes.json](routes.json) as follows. Docker containers can access containers in the same network (automatically created by docker-compose) by using the container's name.
```json
{
  "image" : "http://ia:2345/upload",
  "opus" : "http://ir:3000/",
  "text" : "http://adaptation:6397/tailored_text",
  "keywords" : "http://adaptation:6397/keywords"
}
```
 Using `docker-compose`
```bash
# start
sudo docker-compose up --build
# stop
sudo docker-compose down
```

Build and run images individually
```bash
# build
sudo docker build -t art/ir -f ir.dockerfile .
sudo docker build -t art/ia -f ia.dockerfile .
sudo docker build -t art/adaptation -f adaptation.dockerfile .

# run
sudo docker run --name ir -p 3000:3000 art/ir
sudo docker run --name ia -p 2345:2345 art/ia
sudo docker run --name adaptation -p 6397:6397 art/adaptation

# stop
sudo docker rm -f ir ia adaptation
```

## Test UI
APIs and communication can be tested by opening in a browser [test.html](test.html) without the need of an emulator for the mobile app.
