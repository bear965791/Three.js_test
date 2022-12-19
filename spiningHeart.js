let scene, renderer, camera
let cube

// 初始化場景、渲染器、相機、物體
function init() {
  // 建立場景
  scene = new THREE.Scene()

  // 建立渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight) // 場景大小
  renderer.setClearColor(0xeeeeee, 1.0) // 預設背景顏色
  renderer.shadowMap.enable = false // 陰影效果

  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)

  // 建立相機
  //(視角:又稱為視野、視場，指的是我們能從畫面上看到的視野範圍，一般在遊戲中會設定在 60 ~ 90 度
  // 畫面寬高比:渲染結果的畫面比例，一般都是使用 window.innerWidth / window.innerHeight 。
  // 近面距離（near）:從距離相機多近的地方開始渲染，一般推薦使用 0.1。
  // 遠面距離（far）:相機能看得多遠，一般推薦使用 1000，可視需求調整，設置過大會影響效能。)
  camera = new THREE.PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  //這個屬性是指相機會盯著何處，一般靜止觀察的相機都是設定為 camera.lookAt(scene.position)，就是觀察場景固定的位置。
  //但若今天你要讓相機動態追蹤某個物體，那你可以在渲染時改變 camera.lookeAt 中的參數為特定物體的某個基準座標，
  camera.position.set(50, 50, 50)
  camera.lookAt(scene.position)

  // 建立光源
  let pointLight = new THREE.PointLight(0xffffff)
  pointLight.position.set(-10, 10, 10)
  scene.add(pointLight)

  // 建立物體
  // 一般建立物體的 SOP 就是宣告形狀（geometry）、材質（material），
  // 然後用這兩個要素建立一個網格物件（mesh），並設定其位置加到場景中便可完成。
  const x = 0, y = 0;

    const heartShape = new THREE.Shape();

    heartShape.moveTo( x + 5, y + 5 );
    heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
    heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
    heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
    heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
    heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
    heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );
  const geometry = new THREE.ShapeGeometry(heartShape) // 幾何體
  const material = new THREE.MeshPhongMaterial({
    color: 0xE06666
  }) // 材質
  cube = new THREE.Mesh(geometry, material) // 建立網格物件
  cube.position.set(0, 0, 0)
  scene.add(cube)
}

// 建立動畫
function animate() {
  cube.rotation.x += 0.01
  cube.rotation.y += 0.07
}

// 渲染場景
function render() {
  animate()
  //若是要讓場景中的物體動起來，就需要處理「每隔一段時間重新渲染場景」的工作，而這就是requestAnimationFrame 所負責的部分。
// requestAnimationFrame 是 HTML5 中瀏覽器提供的一個為動畫而生的接口，它能讓畫面盡可能平滑、高效地進行重新渲染，還有效節省 CPU、GPU 資源，所以一般在 Three.js 會透過它來幫忙重新渲染場景。
  requestAnimationFrame(render) //使得動畫能持續地進行下去
  renderer.render(scene, camera)
}

// 監聽螢幕寬高來做簡單 RWD 設定
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()