/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

export default () => {

    // Avoid jest open handle error => https://github.com/visionmedia/supertest/issues/520
    
    // Since we are writing on file the logs, just wait 500ms after all tests suites
    // in order to be sure that the stream is over.
    return new Promise(resolve => setTimeout(() => resolve(), 500)); 
}