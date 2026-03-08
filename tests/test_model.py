import numpy as np
import pytest
from thinc.api import Model, Shim

# --- Stubs / helpers ---
def create_model(name: str) -> Model:
    """Create a minimal sub-model for testing with allocated params."""
    model = Model(
        name,
        forward=lambda X, is_train=True: (X, lambda dY: dY),
        dims={"nI": 10, "nO": None},
        params={},
    )
    # Allocate default parameters
    model.set_param("W", model.ops.alloc((10, 1), dtype="f"))  # 2D float32
    model.set_param("b", model.ops.alloc((1,), dtype="f"))      # 1D float32
    return model

class MyShim(Shim):
    """Minimal shim for testing."""
    def __init__(self, model=None):
        super().__init__(model=model)
        self.name = "testshim"

    def begin_update(self, X, drop=0.0, is_train=True):
        # Minimal pass-through behavior
        return X, lambda dX: dX

# --- Tests ---
def test_model_creation():
    model_a = create_model("a")

    # Main test model
    model = Model(
        "test",
        forward=lambda X, is_train=True: (X, lambda dY: dY),
        dims={"nI": 10, "nO": None},
        params={},  # allocate below
        refs={"a": model_a, "b": None},
        attrs={"foo": "bar"},
        shims=[MyShim(None)],
        layers=[model_a, model_a],
    )

    # Allocate main model parameters
    model.set_param("W", model.ops.alloc((10, 1), dtype="f"))
    model.set_param("b", model.ops.alloc((1,), dtype="f"))

    # Forward pass
    X = model.ops.alloc((5, 10), dtype="f")  # batch of 5
    Y, backprop = model.begin_update(X)
    assert Y.shape == X.shape

    # Backward pass
    dX = backprop(X)
    assert dX.shape == X.shape

def test_model_params():
    model_a = create_model("a")
    model = Model(
        "test",
        forward=lambda X, is_train=True: (X, lambda dY: dY),
        dims={"nI": 10, "nO": None},
        params={},
        refs={"a": model_a, "b": None},
        attrs={},
        shims=[],
        layers=[model_a],
    )

    # Allocate main model parameters
    model.set_param("W", model.ops.alloc((10, 1), dtype="f"))
    model.set_param("b", model.ops.alloc((1,), dtype="f"))

    # Access parameters safely
    W = model.get_param("W")
    b = model.get_param("b")

    assert W is not None
    assert W.shape == (10, 1)
    assert b.shape == (1,)
