# tests/util.py
from pathlib import Path
import tempfile
import contextlib

@contextlib.contextmanager
def make_tempdir():
    """Yield a temporary directory as a pathlib.Path and clean up after use."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)
