import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { watchAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';
import { resolveMediaUrl } from '../utils/media';
import './AdminDashboard.css';

const revokeUrls = (urls) => {
  urls.forEach((u) => {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  });
};

const emptyWatchForm = {
  title: '',
  description: '',
  price: '',
  category: 'casual',
  brand: 'Titan',
  stock: 10,
  rating: 5,
  reviews: 0,
  imagesFiles: [],
  videoFile: null,
};

function WatchesPage() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showWatchModal, setShowWatchModal] = useState(false);
  const [editingWatch, setEditingWatch] = useState(null);
  const [watchForm, setWatchForm] = useState(emptyWatchForm);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [watchSearch, setWatchSearch] = useState('');

  const refreshWatches = async () => {
    const watchRes = await watchAPI.getAllWatches();
    setWatches(Array.isArray(watchRes.data) ? watchRes.data : []);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!admin) {
      navigate('/admin');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        await refreshWatches();
      } catch {
        Swal.fire('Error', 'Failed to load watches', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [admin, authLoading, navigate]);

  const filteredWatches = useMemo(() => {
    const q = watchSearch.trim().toLowerCase();
    if (!q) return watches;
    return watches.filter((w) => [w.title, w.category, w.brand].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [watches, watchSearch]);

  const clearPreviews = () => {
    revokeUrls(previewImageUrls);
    if (previewVideoUrl) revokeUrls([previewVideoUrl]);
    setPreviewImageUrls([]);
    setPreviewVideoUrl('');
  };

  const handleCloseWatchModal = () => {
    clearPreviews();
    setShowWatchModal(false);
  };

  const handleOpenWatchModal = (watch = null) => {
    clearPreviews();

    if (watch) {
      setEditingWatch(watch);
      setWatchForm({
        title: watch.title || '',
        description: watch.description || '',
        price: watch.price ?? '',
        category: watch.category || 'casual',
        brand: watch.brand || 'Titan',
        stock: watch.stock ?? 10,
        rating: watch.rating ?? 5,
        reviews: watch.reviews ?? 0,
        imagesFiles: [],
        videoFile: null,
      });
    } else {
      setEditingWatch(null);
      setWatchForm(emptyWatchForm);
    }
    setShowWatchModal(true);
  };

  const handleSaveWatch = async (e) => {
    e.preventDefault();

    try {
      if (!editingWatch && (!watchForm.imagesFiles || watchForm.imagesFiles.length === 0)) {
        Swal.fire('Missing images', 'Please upload at least one image.', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('title', watchForm.title);
      formData.append('description', watchForm.description);
      formData.append('price', String(watchForm.price));
      formData.append('category', watchForm.category);
      formData.append('brand', watchForm.brand);
      formData.append('stock', String(watchForm.stock));
      formData.append('rating', String(watchForm.rating));
      formData.append('reviews', String(watchForm.reviews));

      (watchForm.imagesFiles || []).forEach((file) => {
        formData.append('images', file);
      });

      if (watchForm.videoFile) {
        formData.append('video', watchForm.videoFile);
      }

      if (editingWatch) {
        await watchAPI.updateWatch(editingWatch._id, formData);
        Swal.fire('Success', 'Watch updated', 'success');
      } else {
        await watchAPI.createWatch(formData);
        Swal.fire('Success', 'Watch created', 'success');
      }

      clearPreviews();
      setShowWatchModal(false);
      await refreshWatches();
    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed';
      Swal.fire('Error', message, 'error');
    }
  };

  const handleDeleteWatch = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete watch?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await watchAPI.deleteWatch(id);
      await refreshWatches();
      Swal.fire('Deleted', 'Watch removed', 'success');
    } catch {
      Swal.fire('Error', 'Delete failed', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-dashboard">
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Spinner />
        </Container>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container">
        <h2>Watches</h2>

        <Card className="dashboard-card">
          <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <b>Watches ({filteredWatches.length})</b>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Form.Control
                size="sm"
                className="search-input"
                placeholder="Search watches..."
                value={watchSearch}
                onChange={(e) => setWatchSearch(e.target.value)}
              />
              <Button size="sm" className="btn-add-watch" onClick={() => handleOpenWatchModal()}>
                Add Watch
              </Button>
            </div>
          </Card.Header>

          <Card.Body>
            <Table hover size="sm" responsive className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatches.map((w) => (
                  <tr key={w._id}>
                    <td>{w.title}</td>
                    <td>{w.category}</td>
                    <td>{formatCurrencyINR(w.price)}</td>
                    <td>{w.stock ?? '-'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button size="sm" className="btn-edit" onClick={() => handleOpenWatchModal(w)}>
                          Edit
                        </Button>
                        <Button size="sm" className="btn-delete" onClick={() => handleDeleteWatch(w._id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        <Modal className="admin-modal" show={showWatchModal} onHide={handleCloseWatchModal}>
          <Modal.Header closeButton>
            <Modal.Title>{editingWatch ? 'Edit Watch' : 'Add Watch'}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={handleSaveWatch}>
              {(editingWatch?.images?.length > 0 || editingWatch?.image || editingWatch?.video) && (
                <div className="mb-3">
                  <div className="form-label-modal">Current Media</div>
                  <div className="image-preview">
                    {(editingWatch.images && editingWatch.images.length > 0
                      ? editingWatch.images
                      : editingWatch.image
                        ? [editingWatch.image]
                        : []
                    ).map((img, idx) => (
                      <img key={`${img}-${idx}`} src={resolveMediaUrl(img)} alt="" />
                    ))}
                  </div>
                  {editingWatch.video && (
                    <div className="mt-2">
                      <video
                        controls
                        style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}
                        src={resolveMediaUrl(editingWatch.video)}
                      />
                    </div>
                  )}
                </div>
              )}

              <Form.Group className="form-group-modal">
                <Form.Label className="form-label-modal">Upload Images (max 10)</Form.Label>
                <Form.Control
                  className="form-control-modal"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const nextFiles = [...(watchForm.imagesFiles || []), ...files].slice(0, 10);
                    revokeUrls(previewImageUrls);
                    const urls = nextFiles.map((f) => URL.createObjectURL(f));
                    setPreviewImageUrls(urls);
                    setWatchForm((prev) => ({ ...prev, imagesFiles: nextFiles }));
                    e.target.value = '';
                  }}
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <small className="text-muted">Selected: {watchForm.imagesFiles.length} / 10</small>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      revokeUrls(previewImageUrls);
                      setPreviewImageUrls([]);
                      setWatchForm((prev) => ({ ...prev, imagesFiles: [] }));
                    }}
                    disabled={watchForm.imagesFiles.length === 0}
                  >
                    Clear
                  </Button>
                </div>
                {previewImageUrls.length > 0 && (
                  <div className="image-preview">
                    {previewImageUrls.map((url) => (
                      <img key={url} src={url} alt="" />
                    ))}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="form-group-modal">
                <Form.Label className="form-label-modal">Upload Video (optional)</Form.Label>
                <Form.Control
                  className="form-control-modal"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (previewVideoUrl) revokeUrls([previewVideoUrl]);
                    const file = (e.target.files && e.target.files[0]) || null;
                    setPreviewVideoUrl(file ? URL.createObjectURL(file) : '');
                    setWatchForm((prev) => ({ ...prev, videoFile: file }));
                    e.target.value = '';
                  }}
                />
                <div className="d-flex justify-content-end mt-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      if (previewVideoUrl) revokeUrls([previewVideoUrl]);
                      setPreviewVideoUrl('');
                      setWatchForm((prev) => ({ ...prev, videoFile: null }));
                    }}
                    disabled={!watchForm.videoFile && !previewVideoUrl}
                  >
                    Clear
                  </Button>
                </div>
                {previewVideoUrl && (
                  <div className="mt-2">
                    <video
                      controls
                      style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}
                      src={previewVideoUrl}
                    />
                  </div>
                )}
              </Form.Group>

              <Form.Group className="form-group-modal">
                <Form.Label className="form-label-modal">Title</Form.Label>
                <Form.Control
                  className="form-control-modal"
                  placeholder="Title"
                  value={watchForm.title}
                  onChange={(e) => setWatchForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Form.Group>

              <Form.Group className="form-group-modal">
                <Form.Label className="form-label-modal">Description</Form.Label>
                <Form.Control
                  className="form-control-modal"
                  as="textarea"
                  rows={3}
                  placeholder="Description"
                  value={watchForm.description}
                  onChange={(e) => setWatchForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Price</Form.Label>
                    <Form.Control
                      className="form-control-modal"
                      type="number"
                      min="0"
                      value={watchForm.price}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Stock</Form.Label>
                    <Form.Control
                      className="form-control-modal"
                      type="number"
                      min="0"
                      value={watchForm.stock}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, stock: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mt-0">
                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Category</Form.Label>
                    <Form.Select
                      className="form-control-modal"
                      value={watchForm.category}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="luxury">luxury</option>
                      <option value="sports">sports</option>
                      <option value="casual">casual</option>
                      <option value="smartwatch">smartwatch</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Brand</Form.Label>
                    <Form.Control
                      className="form-control-modal"
                      value={watchForm.brand}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, brand: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mt-0">
                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Rating</Form.Label>
                    <Form.Control
                      className="form-control-modal"
                      type="number"
                      min="0"
                      max="5"
                      value={watchForm.rating}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, rating: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="form-group-modal">
                    <Form.Label className="form-label-modal">Reviews</Form.Label>
                    <Form.Control
                      className="form-control-modal"
                      type="number"
                      min="0"
                      value={watchForm.reviews}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, reviews: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button className="btn-submit-modal" type="submit">
                {editingWatch ? 'Update Watch' : 'Create Watch'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default WatchesPage;

