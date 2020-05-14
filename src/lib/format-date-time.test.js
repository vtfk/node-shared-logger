/* eslint-env jest */
const formatDateTime = require('./format-date-time')

describe('Date & time format testing', () => {
  const testDates = [
    { time: '1 1, 2020 00:00:00', fDate: '1/1/2020', fTime: '00:00:00' },
    { time: '1 31, 2020 00:00:00', fDate: '31/1/2020', fTime: '00:00:00' },
    { time: '12 1, 2020 00:00:00', fDate: '1/12/2020', fTime: '00:00:00' },
    { time: '1 1, 2020 23:59:59', fDate: '1/1/2020', fTime: '23:59:59' },
    { time: '12 31, 2020 23:59:59', fDate: '31/12/2020', fTime: '23:59:59' }
  ]
  testDates.forEach(input => {
    it(`formats ${input.time} correctly`, () => {
      const testData = formatDateTime(new Date(input.time))
      expect(testData.fDate).toBe(input.fDate)
      expect(testData.fTime).toBe(input.fTime)
    })
  })
})
