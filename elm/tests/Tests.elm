module Tests exposing (..)

import Expect
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Schedule Logic"
        [ Test.todo "Implement the first test. See https://package.elm-lang.org/packages/elm-explorations/test/latest for how to do this!"
        , test "does a thing" <| \_ -> Expect.equal "string" "string"
        , test "does another thing" (\_ -> Expect.equal 1 2)
        ]
