import {Project} from "./spreadsheet"

const parse = require('csv-parse')

const output = []
// Create the parser
const parser = parse({
  delimiter: ':',
  relax_column_count: true
})

const project = new Project();

// Use the readable stream api
parser.on('readable', function(){
  let record
  while (record = parser.read()) {
    output.push(record)
  }
})

// Catch any error
parser.on('error', function(err){
  console.error(err.message)
})

parser.on('end', function(){
  console.log(output);
})

// Write data to the stream
parser.write("root:x:0:0:root:/root:/bin/bash\n")
parser.write(":someone:x:1022:1022::/home/someone:/bin/bash\n")
// Close the readable stream
parser.end()