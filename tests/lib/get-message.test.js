const matchers = require('jest-extended')
const getMessage = require('../../src/lib/get-message')

expect.extend(matchers)

const testOne = { objOne: 'First obj', objTwo: 'Second obj' }
const testTwo = 123
const testThree = [
  { objThree: 'Third obj', objFour: 'Fourth obj' }
]
const testFour = new Error('Error object')
const testFive = 'Log output'

describe('Get message testing', () => {
  it('Returns a JSON object as stringified', () => {
    const testData = getMessage(testOne)
    expect(testData).toBeString()
    expect(testData).toBe('{"objOne":"First obj","objTwo":"Second obj"}')
  })

  it('Returns a number as a string', () => {
    const testData = getMessage(testTwo)
    expect(testData).toBeNumber()
    expect(testData).toBe(testTwo)
  })

  it('Returns a JSON array as stringified', () => {
    const testData = getMessage(testThree)
    expect(testData).toBeString()
    expect(testData).toBe('[{"objThree":"Third obj","objFour":"Fourth obj"}]')
  })

  it('Returns message property from Error object', () => {
    const testData = getMessage(testFour, 'message')
    expect(testData).toBeString()
    expect(testData).toBe('Error object')
  })

  it('Returns stack property from Error object', () => {
    const testData = getMessage(testFour, 'stack')
    expect(testData).toBeString()
    expect(testData).toContain('Error: Error object\n')
  })

  it('Returns a string from a string', () => {
    const testData = getMessage(testFive)
    expect(testData).toBeString()
    expect(testData).toBe(testFive)
  })
})
