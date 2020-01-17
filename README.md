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

#### Using `docker-compose` (run the entire system)
```bash
# start
sudo docker-compose up --build

# stop
sudo docker-compose down
```

#### Build and run images individually (for debugging purposes)
```bash
# build
sudo docker build -t art/<module> <module>

# run
sudo docker run --name <module> -p <port>:<port> -v routes.json:/art/routes.json art/<module>

# stop
sudo docker rm -f <module>
```

## Test UI
APIs and communication can be tested by opening in a browser [test.html](test.html) without the need of an emulator for the mobile app.