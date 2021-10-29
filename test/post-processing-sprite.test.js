import { expect } from "chai"
import { getImageDataFromRender, getImageDataFromUrl } from "./test-utils"

describe("Post processing sprite", () => {
  it("should render correctly with blur filter", async () => {
    let render = await getImageDataFromRender((renderer, resources) => {
      let model = PIXI3D.Model.from(resources["assets/teapot/teapot.gltf"].gltf)
      model.y = -0.8

      let sprite = new PIXI3D.PostProcessingSprite(renderer)
      sprite.renderObject(model)
      sprite.filters = [new PIXI.filters.BlurFilter()]

      renderer.render(sprite)
    }, [
      "assets/teapot/teapot.gltf",
    ])
    expect(render).to.match(
      await getImageDataFromUrl("snapshots/omohh.png"))
  })
})