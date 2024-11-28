document.addEventListener('DOMContentLoaded', () => {
  const gameArea = document.getElementById('gameArea')
  const gun = document.getElementById('gun')
  const ammoContainer = document.getElementById('ammo')
  const overlay = document.getElementById('overlay')
  const messageBox = document.getElementById('messageBox')

  let score = 0
  let bulletsLeft = 10

  const timeDrawChicken = 3000
  const reloadTime = 3000
  const maxBullets = 10
  const chickens = []

  // Tạo băng đạn
  const drawBulletBelt = () => {
    for (let i = 0; i < maxBullets; i++) {
      const indicator = document.createElement('span')
      indicator.classList.add('bullet-indicator', 'active')
      ammoContainer.appendChild(indicator)
    }
  }
  drawBulletBelt()
  const bulletBelt = document.querySelectorAll('.bullet-indicator')

  const updateScore = () => {
    document.getElementById('score').innerText = `Score: ${score}`
  }

  const createChicken = () => {
    const chicken = document.createElement('div')
    chicken.classList.add('chicken')

    // Vị trí ngẫu nhiên cho con gà
    const randomTop = Math.random() * (gameArea.offsetHeight - 250) + 50
    chicken.style.top = `${randomTop}px`

    // Kích thước tối đa 
    const maxWidth = 100
    const maxHeight = 80
    // Kích thước  tối thiểu
    const minWidth = 80
    const minHeight = 60

    // Kích thước chuẩn khi con gà ở giữa
    const middleY = gameArea.offsetHeight / 2
    const baseWidth = 60
    const baseHeight = 40

    // Tính tỷ lệ kích thước dựa trên vị trí ngẫu nhiên
    const sizeRatio = Math.abs(randomTop - middleY) / (gameArea.offsetHeight / 2)

    // Không nhỏ hơn minWidth, nhỏ hơn minHeight
    const chickenHeight = Math.max(minHeight, baseHeight + (maxHeight - baseHeight) * (1 - sizeRatio))
    const chickenWidth = Math.max(minWidth, baseWidth + (maxWidth - baseWidth) * (1 - sizeRatio))

    // Thêm hình ảnh con gà và áp dụng kích thước
    const chickenImage = document.createElement('img')
    const direction = Math.random() < 0.5 ? 'left' : 'right'   // Chọn hướng bay
    chickenImage.src = direction === 'left' ? './assets/images/chicken-left.png' : './assets/images/chicken-right.png'

    // Áp dụng kích thước cho hình ảnh con gà
    chickenImage.style.width = `${chickenWidth}px`
    chickenImage.style.height = `${chickenHeight}px`

    chicken.appendChild(chickenImage)

    // Xác định hướng bay của con gà
    const animationDirection = direction === 'left' ? 'fly-to-left' : 'fly-to-right'  // Lựa chọn animation dựa trên hướng
    chicken.style.animation = `${animationDirection} 8s linear`

    // Thêm con gà vào gameArea và vào mảng chickens
    gameArea.appendChild(chicken)
    chickens.push(chicken)

    // Xử lý khi animation kết thúc
    chicken.addEventListener('animationend', () => {
      chicken.remove()
      const index = chickens.indexOf(chicken)
      if (index > -1) chickens.splice(index, 1) // Con gà đã qua khung hình
    })
  }

  const showMessage = (msg) => {
    messageBox.innerText = msg
    overlay.style.display = 'flex'
  }

  const hideOverlay = () => {
    overlay.style.display = 'none'
  }

  // Tạo gà theo thời gian
  let lastChickenTime = 0
  const handleChickenCreation = (timestamp) => {
    // 3s cho mỗi con gà
    if (timestamp - lastChickenTime >= timeDrawChicken) {
      createChicken()
      lastChickenTime = timestamp
    }
    requestAnimationFrame(handleChickenCreation)
  }

  requestAnimationFrame(handleChickenCreation)

  gameArea.addEventListener('click', (event) => {
    if (bulletsLeft > 0) {
      bulletsLeft--
      updateBulletBelt()
      fireBullet(event)
    } else {
      showMessage('Out of bullets! Reloading...')
      setTimeout(() => {
        bulletsLeft = maxBullets
        updateBulletBelt()
        console.log('Reloaded!')
        hideOverlay()
      }, reloadTime)
    }
  })

  const fireBullet = (event) => {
    const bullet = document.createElement('div')
    bullet.classList.add('bullet')
    gameArea.appendChild(bullet)

    const targetX = event.clientX - gameArea.getBoundingClientRect().left
    const targetY = event.clientY - gameArea.getBoundingClientRect().top

    const gunRect = gun.getBoundingClientRect()
    const gunCenterX = gunRect.left + gunRect.width / 2 - gameArea.getBoundingClientRect().left
    const gunBottomY = gunRect.bottom - gameArea.getBoundingClientRect().top

    bullet.style.left = `${gunCenterX - 5}px`
    bullet.style.top = `${gunBottomY - 5}px`
    bullet.style.display = 'block'

    const velocityX = targetX - gunCenterX
    const velocityY = targetY - gunBottomY
    const distance = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
    const duration = (distance / 100) * 0.05

    bullet.style.transition = `transform ${duration}s linear`
    bullet.style.transform = `translate(${velocityX}px, ${velocityY}px)`

    bullet.addEventListener('transitionend', () => {
      explodeBullet(targetX - 5, targetY - 5)
      bullet.remove()
    })

    // Kiểm tra va chạm với gà
    function checkCollision() {
      const bulletRect = bullet.getBoundingClientRect()
      chickens.forEach((chicken) => {
        const chickenRect = chicken.getBoundingClientRect()

        if (
          bulletRect.left < chickenRect.right &&
          bulletRect.right > chickenRect.left &&
          bulletRect.top < chickenRect.bottom &&
          bulletRect.bottom > chickenRect.top
        ) {
          const chickenCenterX = (chickenRect.left - 505) + chickenRect.width / 2
          const chickenCenterY = (chickenRect.top - 210) + chickenRect.height / 2
          explodeBullet(chickenCenterX, chickenCenterY)
          chicken.remove()
          bullet.remove()
          score++
          updateScore()
        }
      })
    }

    // Kiểm tra va chạm liên tục với requestAnimationFrame
    function collisionLoop() {
      checkCollision()
      if (bullet.parentElement) {
        requestAnimationFrame(collisionLoop)
      }
    }
    collisionLoop()
  }

  function explodeBullet(x, y) {
    const explosion = document.createElement('div')
    explosion.classList.add('explode')
    explosion.style.left = `${x}px`
    explosion.style.top = `${y}px`
    explosion.style.position = 'absolute'
    explosion.style.width = '10px'
    explosion.style.height = '10px'
    explosion.style.backgroundColor = 'red'
    explosion.style.borderRadius = '50%'
    gameArea.appendChild(explosion)
    explosion.addEventListener('animationend', () => explosion.remove())
  }

  function updateBulletBelt() {
    bulletBelt.forEach((bullet, index) => {
      bullet.classList.toggle('active', index < bulletsLeft)
    })
  }

  updateBulletBelt()

  // Di chuyển và quay đầu súng khi chuột di chuyển
  const gunHead = document.getElementById('gun-head')

  gameArea.addEventListener('mousemove', (event) => {
    const gameAreaRect = gameArea.getBoundingClientRect()
    const mouseX = event.clientX - gameAreaRect.left
    const gameAreaWidth = gameAreaRect.width

    // Tính toán trung tâm của thân súng
    const gunRect = gun.getBoundingClientRect();
    const gunCenterX = gunRect.left + gunRect.width;

    // Tính độ lệch giữa chuột và trung tâm của thân súng
    const deltaX = mouseX - gunCenterX

    const maxAngle = 90 // Góc quay tối đa
    const angleY = (deltaX / gameAreaRect.width) * maxAngle * 2  // Tính góc quay từ -90 đến 90 độ

    let rotate = angleY

    const angleMapping = [
      { min: -110, max: -90, value: -118 },
      { min: -90, max: -70, value: 48 }
    ];

    for (const range of angleMapping) {
      if (angleY >= range.min && angleY <= range.max) {
        rotate = range.value;
        break
      }
    }
    gunHead.style.transform = `rotateY(${rotate}deg)`

    // Scale the movement to slow it down (e.g., 0.4 slows the background)
    const speedFactor = 0.2

    const backgroundPosition = ((mouseX / gameAreaWidth) * 100 - 50) * speedFactor
    gameArea.style.backgroundPosition = `${backgroundPosition}% center`
  })
})
