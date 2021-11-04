module.exports = (time) => {
  const fDate = `${addZero(time.getDate())}.${addZero(time.getMonth() + 1)}.${time.getFullYear()}`
  const fTime = `${addZero(time.getHours())}:${addZero(time.getMinutes())}:${addZero(time.getSeconds())}`

  return {
    fDate,
    fTime
  }
}

function addZero (time) {
  time = time.toString()
  if (time.length < 2) {
    time = `0${time}`
  }
  return time
}
