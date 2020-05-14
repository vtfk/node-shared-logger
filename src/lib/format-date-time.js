module.exports = (time) => {
  const fDate = `${time.getDate()}/${time.getMonth()}/${time.getFullYear()}`
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
