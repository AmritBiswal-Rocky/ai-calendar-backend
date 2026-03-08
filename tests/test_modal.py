import numpy as np
import pytest
from thinc.api import Model

# Adjust these imports to your actual module paths if needed
try:
    from my_models import create_model, MyShim  # type: ignore
except Exception:  # fallback for this repo: define minimal stubs
    from thinc.api import Shim

    def create_model(name):
        return Model(name, lambda X: (X, lambda dY: dY))

    class MyShim(Shim):
        name = "testshim"


def test_model_creation():
    # Create a sub-model
    model_a = create_model("a")

    # Main test model
    model = Model(
        "test",
        forward=lambda X: (X, lambda dY: dY),
        dims={"nI": 10, "nO": None},
        params={"W": np.zeros((10,), dtype=np.float32), "b": None},
        refs={"a": model_a, "b": None},
        attrs={"foo": "bar"},
        shims=[MyShim(None)],
        layers=[model_a, model_a],
    )

    # Simple forward pass test
    X = np.ones((5, 10), dtype=np.float32)  # batch of 5
    Y, backprop = model.begin_update(X)

    # Check output shape
    assert Y.shape == X.shape

    # Backward test
    dX = backprop(X)
    assert dX.shape == X.shape


def test_model_params():
    model_a = create_model("a")
    model = Model(
        "test",
        forward=lambda X: (X, lambda dY: dY),
        dims={"nI": 10, "nO": None},
        params={"W": np.zeros((10,), dtype=np.float32), "b": None},
        refs={"a": model_a, "b": None},
        attrs={},
        shims=[],
        layers=[model_a],
    )

    # Access parameters safely
    W = model.get_param("W")
    b = model.get_param("b")

    assert W is not None
    assert W.shape == (10,)
    assert b is None
